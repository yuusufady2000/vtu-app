
const axios = require('axios');

const api = axios.create({
    baseURL: 'https://bilalsadasub.com',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    }
});

let accessToken = null;
let tokenPromise = null;

const getAccessToken = async () => {
    if (accessToken) return accessToken;

    if (tokenPromise) return tokenPromise;

    tokenPromise = (async () => {
        const username = process.env.BILAL_USERNAME;
        const password = process.env.BILAL_PASSWORD;

        if (!username || !password) {
            throw new Error('Bilalsadasub credentials are missing');
        }

        const response = await api.post('/api/user', {}, {
            auth: {
                username,
                password
            }
        });

        if (
            response.data?.status !== 'success' ||
            !response.data?.AccessToken
        ) {
            throw new Error(
                response.data?.message || 'Unable to generate Bilalsadasub token'
            );
        }

        accessToken = response.data.AccessToken;
        return accessToken;
    })();

    try {
        return await tokenPromise;
    } finally {
        tokenPromise = null;
    }
};

const authenticatedPost = async (endpoint, body, retry = true) => {
    const token = await getAccessToken();

    try {
        return await api.post(endpoint, body, {
            headers: {
                Authorization: `Token ${token}`
            }
        });
    } catch (error) {
        if (error.response?.status === 401 && retry) {
            accessToken = null;
            return authenticatedPost(endpoint, body, false);
        }

        throw error;
    }
};

exports.fetchNetworks = async () => {
    const response = await api.get('/api/v1/plans/networks');
    return response.data;
};

exports.fetchDataPlans = async (network, planType) => {
    const response = await api.get('/api/v1/plans/data', {
        params: {
            network,
            ...(planType ? { plan_type: planType } : {})
        }
    });

    return response.data;
};

exports.purchaseData = async ({
    network,
    phone,
    dataPlan,
    requestId
}) => {
    const response = await authenticatedPost('/api/data', {
        network: Number(network),
        phone,
        data_plan: Number(dataPlan),
        bypass: false,
        'request-id': requestId
    });

    return response.data;
};
