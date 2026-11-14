
const axios = require('axios');

const vtugate = axios.create({
    baseURL: process.env.VTUGATE_BASE_URL,
    timeout: 20000,
    headers: {
        Authorization: `Bearer ${process.env.VTUGATE_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
    }
});

exports.fetchAllServices = async () => {
    const response = await vtugate.post('/fetchallservices');
    return response.data;
};

exports.fetchDataPlans = async (serviceId) => {
    const response = await vtugate.post(
        '/fetchdataplans',
        new URLSearchParams({
            service_id: String(serviceId)
        })
    );

    return response.data;
};
