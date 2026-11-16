

const { fetchDataPlans } = require('../util/datapea');

exports.getBuyData = (req,res,next) => {
    fetchDataPlans()
    .then(plans => {
        res.render('shop/data.ejs', {
            pageTitle: 'Buy data',
            plans: plans,
            path: '/data'
        })
    })
    .catch(err => next(err));
}
