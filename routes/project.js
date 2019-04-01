import express from 'express';
import { getProjectByID } from '../models/Project';


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
            return res.redirect('/inisiator/started-project');
        }
        if (!project) {
            error_message = "Proyek tidak tersedia";
            req.flash('error_message', error_message);
            return res.redirect(`/inisiator/project/${req.params.project_id}/edit`);
        } else {
            let data = {
                auth: auth,
                user_type: user_type,
                project: project
            };
            res.render('pages/project/project', data);
        }
    });
});

export default router;