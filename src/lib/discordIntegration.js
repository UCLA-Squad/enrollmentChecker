import axios from 'axios'
import * as dotenv from 'dotenv'
dotenv.config()

if (process.env.DISCORD_WEBHOOK_URL === undefined) {
  throw new Error('DISCORD_WEBHOOK_URL is not defined in .env file')
}

/**
 * Map the class name and section to Discord user IDs
 */
const classNameToIdMap = {
  'COM SCI 180': [
    '618618998870769667',
    '97842904860487680',
    '256990192542416918',
    '746203309823623233',
    '542937555251888143',
    '277555863923982336',
    '240486210798092288',
    '1030944081653792859',
  ],
}

export async function sendClassOpenMessage(className, section) {
  // Handle edge case where we're not alerting anyone for this class
  if (className in classNameToIdMap === false) {
    console.error(`No one is subscribed to this class ${className}`)
    return
  }

  const userIds = classNameToIdMap[className]
  const formattedUserIds = userIds.map(userId => `<@${userId}>`).join(', ')

  // Ping the Discord webhook
  try {
      await axios.post(process.env.DISCORD_WEBHOOK_URL, {
        embeds: [
          {
            title: `${className} - ${section} is now open!`,
            description: `Hi ${formattedUserIds} your class is now open!`,
            color: 5814783,
          },
        ],
      })
  }
  catch (e) {
    
  }
}

sendClassOpenMessage('COM SCI 180', 'LEC 1A')
