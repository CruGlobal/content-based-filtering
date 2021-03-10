const rollbar = require('./config/rollbar')

export async function handler () {
  try {
    console.log('starting now...')
  } catch (error) {
    await rollbar.error(error.message, error)
  }
}
