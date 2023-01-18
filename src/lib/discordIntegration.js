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
  'COM SCI 180': ['618618998870769667', '97842904860487680'],
}

export async function sendClassOpenMessage(className, section) {
  const userIds = classNameToIdMap[className]
  const formattedUserIds = userIds.map(userId => `<@${userId}>`).join(' ')

  // Ping the Discord webhook
  try {
      await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: `Hi ${formattedUserIds}, ${className} ${section} is open!`,
    })
  }
  catch (e) {
    
  }

}

sendClassOpenMessage('COM SCI 180', 'LEC 1A')
