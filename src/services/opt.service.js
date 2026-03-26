const axios = require('axios')

async function sendSMS(Phone, message) {
  // console.log(message);

  // console.log(Phone, message)
  const url = 'https://bulksms.smsroot.com/app/smsapi/index.php';

  const params = {
    key: '467DD867AC81DD',
    campaign: '0',
    routeid: '13',
    type: 'text',
    contacts: Phone,
    senderid: 'MOJIJA',
    msg: message,
    template_id: '1707174402396213814'
  };

  try {
    const response = await axios.get(url, { params });
    console.log(`SMS sent to ${Phone}:`, response.data);

    if (!response.data) {
      throw new Error('No response from SMSRoot');
    }

  } catch (error) {
    console.error(`Failed to send SMS to ${Phone}:`, error);
    throw new Error('Failed to send SMS');
  }
}


async function sendSMS2(Phone, message) {

  const url = 'https://bulksms.smsroot.com/app/smsapi/index.php';

  const params = {
    key: '467DD867AC81DD',
    campaign: '0',
    routeid: '13',
    type: 'text',
    contacts: Phone,
    senderid: 'MOJIJA',
    msg: message,
    template_id: '1707174774488064756'
  };
  try {
    const response = await axios.get(url, { params });
    console.log(`SMS sent to ${Phone}:`, response.data);
  } catch (error) {
    console.error(`Failed to send SMS to ${Phone}:`, error);
    throw new Error('Failed to send SMS');
  }
}

module.exports = { sendSMS, sendSMS2 }
