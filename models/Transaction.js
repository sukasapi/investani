import mongoose from 'mongoose';
import {Project} from './Project';

const Schema = mongoose.Schema;

let TransactionSchema = mongoose.Schema({
    stock_quantity: {
        type: Number
    },
    status: {
        type: String
    },
    receipt: {
        type: String
    },
    due_date: {
        type: Date
    },
    payment_date: {
        type: Date
    },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    investor: { type: Schema.Types.ObjectId, ref: 'User'},
    inisiator: { type: Schema.Types.ObjectId, ref: 'User'},
}, {
    timestamps: true
});

export const Transaction = mongoose.model('Transaction', TransactionSchema);

export const createTransaction = (newTransaction, callback) => {
    newTransaction.save(callback);
}
export const getTransactionById = (id, callback) => {
    Transaction.findById(id, callback).populate('project').populate('investor').sort({ createdAt: -1 });
}
export const getTransactionByStatus = (status, callback) => {
    let obj = {
        status: status
    }
    Transaction.find(obj, callback).populate('project').populate('investor').sort({ createdAt: -1 });
}
export const getBackedProjectTransaction = (investor_id, callback) => {
    let obj = {
        investor: investor_id
    }
    Transaction.find(obj).distinct('project', function (error, projects_id) {
        Project.find({'_id': {$in: projects_id}}, callback).populate('category').populate('inisiator');
    });
}
export const getTransactionByInvestorandProject = (investor_id, project_id, callback) => {
    let obj = {
        investor: investor_id,
        project: project_id
    }
    Transaction.find(obj, callback).populate('project');
}
export const updateTransaction = (transaction_id, updateValue, callback) => {
    Transaction.findByIdAndUpdate(transaction_id, updateValue, callback);
}