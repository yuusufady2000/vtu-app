
const datapea = require('../util/datapea');
const crypto = require('crypto');

const networkIds = {
    mtn: 1,
    airtel: 2,
    glo: 3,
    '9mobile': 4
};

const getPlansArray = (result) => {
    if (Array.isArray(result)) {
        return result;
    }

    if (Array.isArray(result?.data)) {
        return result.data;
    }

    if (Array.isArray(result?.plans)) {
        return result.plans;
    }

    if (Array.isArray(result?.data?.data)) {
        return result.data.data;
    }

    return [];
};

const normalizeNetwork = (network) => {
    const value = String(network || '').trim().toLowerCase();

    if (value === '9 mobile' || value === '9mobile') {
        return '9mobile';
    }

    return value;
};

exports.getDataPage = async (req, res) => {
    try {
        const result = await datapea.fetchDataPlans();
        const dataPlans = getPlansArray(result);

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataPlans,
            errorMessage: null
        });
    } catch (error) {
        console.error('DATAPEA PLANS ERROR:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataPlans: [],
            errorMessage: 'Unable to load data plans. Please try again.'
        });
    }
};

exports.getDataPlans = async (req, res) => {
    try {
        const network = normalizeNetwork(req.body.network);
        const type = String(req.body.type || '').trim().toLowerCase();

        if (!network || !networkIds[network]) {
            return res.status(400).json({
                status: false,
                message: 'Please select a valid network.'
            });
        }

        const result = await datapea.fetchDataPlans();
        const plans = getPlansArray(result);

        const filteredPlans = plans.filter(plan => {
            const planNetwork = normalizeNetwork(plan.network);
            const planType = String(plan.type || '').trim().toLowerCase();

            return planNetwork === network && (!type || planType === type);
        });

        return res.status(200).json({
            status: true,
            count: filteredPlans.length,
            data: filteredPlans
        });
    } catch (error) {
        console.error('DATAPEA FETCH PLANS ERROR:', {
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

        if (!/^0\d{10}$/.test(phone)) {
            return res.status(400).json({
                status: false,
                message: 'Enter a valid 11-digit phone number.'
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

        const plansResult = await datapea.fetchDataPlans();
        const plans = getPlansArray(plansResult);

        const selectedPlan = plans.find(plan =>
            Number(plan.plan_id) === planId &&
            normalizeNetwork(plan.network) === networkName
        );

        if (!selectedPlan) {
            return res.status(400).json({
                status: false,
                message: 'The selected plan is invalid. Please refresh the plans and try again.'
            });
        }

        const result = await datapea.purchaseData({
            network,
            phone,
            planId,
            requestId: `data_${crypto.randomUUID()}`
        });

        const providerStatus = String(
            result?.status || result?.Status || ''
        ).trim().toLowerCase();

        if (providerStatus === 'success' || providerStatus === 'successful') {
            return res.status(200).json({
                status: true,
                transactionStatus: 'success',
                message: result.message || 'Data purchase successful.',
                data: result
            });
        }

        if (providerStatus === 'pending' || providerStatus === 'processing') {
            return res.status(200).json({
                status: true,
                transactionStatus: 'pending',
                message: result.message || 'Your data purchase is being processed.',
                data: result
            });
        }

        return res.status(502).json({
            status: false,
            transactionStatus: 'unknown',
            message: result?.message || 'The provider returned an unconfirmed transaction status.',
            data: result
        });

    } catch (error) {
        console.error('DATAPEA PURCHASE ERROR:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        return res.status(error.response?.status || 502).json({
            status: false,
            message: error.response?.data?.message || 'Unable to process the data purchase.'
        });
    }
};
