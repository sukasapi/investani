import express from 'express';
import { getProjectByID } from '../models/Project';
import moment from 'moment';
moment.locale('id');

const router = express.Router();

router.get('/:project_id', function (req, res) {
    let error_message;
    let auth = false;
    let user_type = null;
    let target = [];
    if (req.isAuthenticated()) {
        auth = true;
        user_type = req.user.user_type[0].name;
    }
    getProjectByID(req.params.project_id, function (error, project) {
        if (error) {
            error_message = "Terjadi kesalahan";
            req.flash('error_message', error_message);
            return res.redirect('/');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect('/');
        }
        else {
            if (project.status == 'verified') {
                let data = {
                    auth: auth,
                    user_type: user_type,
                    project: project,
                    start_date: moment(project.basic[0].duration[0].start_date).format('LL'),
                    due_date: moment(project.basic[0].duration[0].due_date).format('LL'),
                    duration: moment(project.basic[0].duration[0].due_campaign).diff(moment(project.basic[0].duration[0].start_campaign), 'days')
                };
                return res.render('pages/project/project', data);
            }
            else {
                return res.redirect('/');
            }
        }
    });
});

export default router;