
const axios = require('axios');

const vtugate = axios.create({
  baseURL: process.env.VTUGATE_BASE_URL,
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${process.env.VTUGATE_API_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});

exports.fetchDataPlans = async (serviceId) => {
  const response = await vtugate.post(
    '/fetchdataplans',
    new URLSearchParams({
      service_id: String(serviceId)
    })
  );

  return response.data;
};
