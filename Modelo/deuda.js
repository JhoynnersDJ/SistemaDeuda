const mongoose = require('mongoose');

const DeudaSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  descripcion: { type: String, required: true },
  monto: { type: Number, required: true },
  fechaEmision: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'pagada', 'parcial'], default: 'pendiente' }
});

module.exports = mongoose.model('Deuda', DeudaSchema);