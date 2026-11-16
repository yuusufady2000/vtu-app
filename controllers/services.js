
const bilalsadasub = require('../util/bilalsadasub');
const crypto = require('crypto');

const networkIds = {
    MTN: 1,
    AIRTEL: 2,
    GLO: 3,
    T2: 4,
    VITEL: 5
};

const normalizeNetwork = (network) => {
    const value = String(network || '').trim().toUpperCase();

    if (value === '9MOBILE' || value === '9 MOBILE') return 'T2';

    return value;
};

const getPlansArray = (result) => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    return [];
};

const getPlanType = (type) => {
    const value = String(type || '').trim().toUpperCase();

    if (value === 'CORPORATE GIFTING') {
        return 'COOPERATE GIFTING';
    }

    return value;
};

exports.getDataPage = async (req, res) => {
    try {
        const result = await bilalsadasub.fetchNetworks();

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            networks: getPlansArray(result),
            dataPlans: [],
            errorMessage: null
        });
    } catch (error) {
        console.error('BILALSADASUB NETWORK ERROR:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            networks: [],
            dataPlans: [],
            errorMessage: 'Unable to load networks. Please try again.'
        });
    }
};

exports.getDataPlans = async (req, res) => {
    try {
        const network = normalizeNetwork(req.body.network);
        const planType = getPlanType(req.body.type);

        if (!networkIds[network]) {
            return res.status(400).json({
                status: false,
                message: 'Please select a valid network.'
            });
        }

        const result = await bilalsadasub.fetchDataPlans(
            network,
            planType
        );

        const plans = getPlansArray(result);

        return res.status(200).json({
            status: true,
            count: plans.length,
            data: plans
        });
    } catch (error) {
        console.error('BILALSADASUB FETCH PLANS ERROR:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        return res.status(502).json({
            status: false,
            message: 'Unable to fetch data plans.'
        });
    }
};

exports.postBuyData = async (req, res) => {
    try {
        const phone = String(req.body.phone || '').trim();
        const networkName = normalizeNetwork(req.body.network);
        const planId = Number(req.body.planId);
        const network = networkIds[networkName];

        if (!/^0\d{10}$/.test(phone) && !/^234\d{10}$/.test(phone)) {
            return res.status(400).json({
                status: false,
                message: 'Enter a valid phone number.'
            });
        }

        if (!network) {
            return res.status(400).json({
                status: false,
                message: 'Please select a valid network.'
            });
        }

        if (!Number.isSafeInteger(planId) || planId <= 0) {
            return res.status(400).json({
                status: false,
                message: 'Please select a valid data plan.'
            });
        }

        const plansResult = await bilalsadasub.fetchDataPlans(networkName);
        const plans = getPlansArray(plansResult);

        const selectedPlan = plans.find(plan =>
            Number(plan.plan_id) === planId
        );

        if (!selectedPlan) {
            return res.status(400).json({
                status: false,
                message: 'The selected plan is invalid. Refresh the plans and try again.'
            });
        }

        const result = await bilalsadasub.purchaseData({
            network,
            phone,
            dataPlan: planId,
            requestId: `data_${crypto.randomUUID()}`
        });

        const providerStatus = String(result?.status || '')
            .trim()
            .toLowerCase();

        if (providerStatus === 'success') {
            return res.status(200).json({
                status: true,
                transactionStatus: 'success',
                message: result.message || 'Data purchase successful.',
                data: result
            });
        }

        if (providerStatus === 'process') {
            return res.status(200).json({
                status: true,
                transactionStatus: 'pending',
                message: result.message || 'Your data purchase is being processed.',
                data: result
            });
        }

        if (providerStatus === 'fail') {
            return res.status(200).json({
                status: false,
                transactionStatus: 'failed',
                message: result.message || 'The data purchase failed.',
                data: result
            });
        }

        return res.status(502).json({
            status: false,
            transactionStatus: 'unknown',
            message: 'The provider returned an unrecognized transaction status.'
        });
    } catch (error) {
        console.error('BILALSADASUB PURCHASE ERROR:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        return res.status(error.response?.status || 502).json({
            status: false,
            message: error.response?.data?.message ||
                'Unable to process the data purchase.'
        });
    }
};
