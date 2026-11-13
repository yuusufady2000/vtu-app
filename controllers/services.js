
exports.getDataPage = async (req, res, next) => {
    try {
        const result = await vtugate.fetchAllServices();

        console.log('VTUGATE SERVICES RESPONSE:', result);

        if (!result.status) {
            throw new Error(result.message || 'VTUGATE returned unsuccessful status');
        }

        const dataServices = (result.data || []).filter(
            service => service.service_type === 'data'
        );

        console.log('DATA SERVICES:', dataServices);

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataServices
        });

    } catch (error) {
        console.error('FETCH ALL SERVICES ERROR:', {
            message: error.message,
            status: error.response?.status,
            response: error.response?.data
        });

        res.render('shop/data', {
            pageTitle: 'Buy Data',
            path: '/buy-data',
            dataServices: [],
            errorMessage: 'Unable to load data networks. Please try again.'
        });
    }
};
