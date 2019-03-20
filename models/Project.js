import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let ProjectSchema = mongoose.Schema({
    basic: [{
        title: {
            type: String
        },
        category: {
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
        goal:{
            type: Number
        },
        duration: [{
            campaign: {
                type: String
            },
            start_date: {
                type: Date
            },
            duration: {
                type: Number
            }
        }],
        roi: {
            type: Number
        },
        stock: [{
            price: {
                type: Number
            },
            total: {
                type: Number
            }
        }],
    }],
    budget: [{
        description: {
            type: String
        },
        activity_date: {
            type: Date
        },
        amount: {
            type: String
        }
    }],
    project: [{
        abstract: {
            type: String
        },
        prospectus: {
            type: String
        },
    }],
    image: [{
        filename: {
            type: String
        }
    }],
    inisiator: { type: Schema.Types.ObjectId, ref: 'User' }
},
{
    timestamps: true
});

export const Project = mongoose.model('Project', ProjectSchema);

export const createProject = (newProject, callback) => {
    newProject.save(callback);
}
export const updateProject = (project_id, updateValue, callback) => {
    Project.findByIdAndUpdate(project_id, updateValue, callback);
  }
export const getProjectByID = (id, callback) => {
    Project.findById(id, callback);
}
export const getProjectByInisiator = (id, callback) => {
    let Obj = {
      inisiator: id
    }
    Project.findOne(Obj, callback).sort({ createdAt: -1 });
  }