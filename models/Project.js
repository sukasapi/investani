import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let ProjectSchema = mongoose.Schema({
    basic: [{
        title: {
            type: String
        },
        province: [{
            province_id: {
              type: String
            },
            province_name: {
              type: String
            }
        }],
        city: [{
            city_id: {
                type: String
            },
            city_name: {
                type: String
            }
        }],
        stock: [{
            price: {
                type: Number
            },
            total: {
                type: Number
            },
            remain: {
                type: Number
            },
            temp: {
                type: Number
            },
            max_invest: {
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
        alternative_activity_date: {
            type: Date
        },
        amount: {
            type: Number
        },
        alternative_amount: {
            type: Number
        },
        status: {
            type: String
        },
        receipt: {
            type: String
        },
        official_record: {
            type: String
        }
    }],
    project: [{
        unit_value: {
            type: Number
        },
        duration: [{
            campaign: {
                type: Number
            },
            start_campaign: {
                type: Date
            },
            due_campaign: {
                type: Date
            },
            duration: {
                type: Number
            },
            start_date: {
                type: Date
            },
            due_date: {
                type: Date
            }
        }],
        roi: {
            type: Number
        },
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
    status: {
        type: String
    },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    sub_category: {
        type: Schema.Types.ObjectId
    },
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
    Project.findById(id, callback).populate('category').populate('inisiator');
}
export const getProjectByStatus = (status, callback) => {
    let Obj = {
        status: status
    }
    Project.find(Obj, callback).populate('inisiator').sort({ createdAt: -1 });
}
export const getProjectIndex = (status, callback) => {
    let Obj = {
        status: status
    }
    Project.find(Obj, callback).populate('inisiator').sort({ createdAt: -1 }).limit(3);
}
export const getProjectByInisiator = (id, callback) => {
    let Obj = {
      inisiator: id
    }
    Project.find(Obj, callback).sort({ createdAt: -1 });
}
export const getProjectByInisiatorAndStatus = (id, status, callback) => {
    let Obj = {
      inisiator: id,
      status: status
    }
    Project.find(Obj, callback).sort({ createdAt: -1 });
}