const axios = require('axios');

const datapea = axios.create({
    baseURL: 'https://datapea.com/api/',
    timeout:30000,
    headers: {
        'Authorization': `Token ${process.env.DATAPEA_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

const fetchDataPlans = () => {
    return datapea.get('data/data_plans')
    .then(response => {
        console.log(response.data);
        return response.data;
    })
    .catch(err => {
        console.log(err.response ? err.response : err.message);
        return [];
    });
}
 
module.exports = {fetchDataPlans, datapea};

// const datapea = axios.create({
//     baseURL: 'https://datapea.com/api',
//     timeout: 30000,
//     headers: {
//         Authorization: `Token ${process.env.DATAPEA_API_KEY}`,
//         'Content-Type': 'application/json',
//         Accept: 'application/json'
//     }
// });

// exports.fetchDataPlans = async () => {
//     const response = await datapea.get('/data_plans');
//     return response.data;
// };

// exports.purchaseData = async ({ network, phone, planId, requestId }) => {
//     const response = await datapea.post('/data', {
//         network: Number(network),
//         phone,
//         plan_id: Number(planId),
//         'request-id': requestId
//     });

//     return response.data;
// };
