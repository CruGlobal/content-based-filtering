export const query = `
WITH
    newData AS (
        SELECT uri, payload, FARM_FINGERPRINT(payload) as payloadHash FROM (
            SELECT
            original_url as uri,
            CONCAT(
                '[',
                ARRAY_TO_STRING(
                    ARRAY_AGG(
                        TO_JSON_STRING(
                            STRUCT(
                                recommendation_url as uri,
                                recommendation_title as title,
                                recommendation_image_url as imageUri,
                                recommendation_display_category as category,
                                recommendation_number as number
                            )
                        )
                        ORDER BY recommendation_number
                        LIMIT 3
                    ),
                    ','
                ),
                ']'
            ) as payload
            FROM \`${process.env.BIGQUERY_TABLE_NAME}\`
            GROUP BY original_url
            LIMIT 3 # Temporary limit for development
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
    WHEN newData.uri = existingData.uri THEN 'update'
    WHEN existingData.uri is NULL THEN 'create'
END as operation
FROM newData
FULL OUTER JOIN existingData ON newData.uri = existingData.uri
WHERE IFNULL(newData.payloadHash != existingData.payloadHash, true)
`;
