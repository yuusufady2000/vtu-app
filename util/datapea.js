
const axios = require('axios');
const crypto = require('crypto');

const datapea = axios.create({
    baseURL: process.env.DATAPEA_BASE_URL || 'https://datapea.com/api',
    timeout: 30000,
    headers: {
        Authorization: `${process.env.DATAPEA_AUTH_SCHEME || 'Token'} ${process.env.DATAPEA_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

exports.fetchDataPlans = async () => {
    const response = await datapea.get('/data_plans');
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
