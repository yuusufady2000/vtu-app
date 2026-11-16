
const axios = require('axios');
const crypto = require('crypto');

const API_KEY = process.env.DATAPEA_API_KEY;

if (!API_KEY) {
    throw new Error('DATAPEA_API_KEY is missing');
}

const datapea = axios.create({
    baseURL: 'https://datapea.com/api',
    timeout: 30000,
    headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

exports.fetchDataPlans = async () => {
    const response = await datapea.get('/data/data_plans');
    return response.data;
};

exports.purchaseData = async ({ network, phone, planId, requestId }) => {
    const response = await datapea.post('/data', {
        network: Number(network),
        phone,
        plan_id: Number(planId),
        'request-id': requestId || `data_${crypto.randomUUID()}`
    });

    return response.data;
};
