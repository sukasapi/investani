import mongoose from 'mongoose';

const Schema = mongoose.Schema;

let NotificationSchema = mongoose.Schema({
    status: {
        type: String
    },
    entity: {
        type: String
    },
    description: {
        type: String
    },
    url: {
        type: String
    },
    budget_id: {
        type: String
    },
    sender: {
        type: Schema.Types.ObjectId, ref: 'User'        
    },
    receiver: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    
},
{
    timestamps: true
});

export const Notification = mongoose.model('Notification', NotificationSchema);
export const createNotification = (newNotification, callback) => {
    newNotification.save(callback);
}
export const getNotificationByReceiverAndStatus = (receiver, status, callback) => {
    Notification.find({ receiver: receiver, status: status }, callback).distinct('entity');
}
export const updateNotificationByEntity = (entity, updateValue, callback) => {
    Notification.updateMany(entity, updateValue, callback);
}