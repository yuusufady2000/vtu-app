
const axios = require('axios');

const datapea = axios.create({
    baseURL: 'https://datapea.com/api/',
    timeout: 30000,
    headers: {
        Authorization: `Bearer ${process.env.DATAPEA_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

const fetchDataPlans = async () => {
    try {
        const response = await datapea.get('data/data_plans');

        console.log('Data plans fetched:', response.data);

        return response.data;
    } catch (err) {
        console.log('Datapea status:', err.response?.status);
        console.log('Datapea error:', err.response?.data);

        throw err;
    }
};

module.exports = {
    fetchDataPlans,
    datapea
};
