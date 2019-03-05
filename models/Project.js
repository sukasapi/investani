import mongoose from 'mongoose';

let ProjectSchema = mongoose.Schema({
    title: {
        type: String
    },
    province: [{
        province_id: {
          type: Number
        },
        province_name: {
          type: String
        }
    }],
    city: [{
        city_id: {
            type: Number
        },
        city_name: {
            type: String
        }
    }],
    area: {
        type: Number
    },
    plant_category: {
        type: String
    },
    goal:{
        type: Number
    },
    duration: [{
        start_date: {
            type: Date
        },
        duration: {
            type: Number
        }
    }],
    stock: [{
        price: {
            type: Number
        },
        total: {
            type: Number
        }
    }], 
    prospectus: {
        type: String
    }
},
{
    timestamps: true
});

export const Project = mongoose.model('Project', ProjectSchema);

export const createProject = (newProject, callback) => {
    newProject.save(callback);
}