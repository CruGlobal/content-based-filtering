const tableName = process.env.BIGQUERY_TABLE_NAME;
if (!tableName) {
  throw new Error('BIGQUERY_TABLE_NAME env var was not set');
}

// FARM_FINGERPRINT(...) is wrapped in ToHex(...) from https://stackoverflow.com/a/51600210/665224
// because FARM_FINGERPRINT outputs a signed 64 bit integer instead of unsigned https://github.com/lovell/farmhash/issues/26
// which was dropping bits when resending the hash to BigQuery and comparing

export const query = `
CREATE TEMP FUNCTION ToHex(x INT64) AS (
  (SELECT STRING_AGG(FORMAT('%02x', x >> (byte * 8) & 0xff), '' ORDER BY byte DESC)
   FROM UNNEST(GENERATE_ARRAY(0, 7)) AS byte)
);

WITH
    newData AS (
        SELECT uri, payload, ToHex(FARM_FINGERPRINT(payload)) as payloadHash FROM (
            SELECT
            original_page_url as uri,
            CONCAT(
                '[',
                ARRAY_TO_STRING(
                    ARRAY_AGG(
                        TO_JSON_STRING(
                            STRUCT(
                                recommendation_page_url as uri,
                                recommendation_title as title,
                                recommendation_image_url as imageUri,
                                recommendation_display_category as category
                            )
                        )
                        ORDER BY recommendation_number
                        LIMIT 3
                    ),
                    ','
                ),
                ']'
            ) as payload
            FROM \`${tableName}\`
            GROUP BY original_page_url
        )
    ),
    existingData AS (
        SELECT uri, payloadHash FROM UNNEST(@lockfile)
    )
SELECT
IFNULL(newData.uri, existingData.uri) as uri,
newData.payload,
newData.payloadHash,
CASE
    WHEN newData.uri is NULL THEN 'delete'
    WHEN existingData.uri is NULL THEN 'create'
    ELSE 'update'
END as operation
FROM newData
FULL OUTER JOIN existingData ON newData.uri = existingData.uri
WHERE newData.payloadHash IS DISTINCT FROM existingData.payloadHash
`;
