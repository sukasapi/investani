import mongoose from 'mongoose';

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
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    investor: { type: Schema.Types.ObjectId, ref: 'User'}
}, {
    timestamps: true
});

export const Transaction = mongoose.model('Transaction', TransactionSchema);

export const createTransaction = (newTransaction, callback) => {
    newTransaction.save(callback);
}

export const getTransactionByStatus = (status, callback) => {
    let obj = {
        status: status
    }
    Transaction.find(obj, callback).populate('project').populate('investor').sort({ createdAt: -1 });
}