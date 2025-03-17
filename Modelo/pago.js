const mongoose = require('mongoose');

const PagoSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  montoPagado: { type: Number, required: true },
  fechaPago: { type: Date, default: Date.now },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'pago_movil'],
    required: true
},
banco: {
    type: String, // Agrega el campo para el nombre del banco
    required: false // O true, dependiendo de si es obligatorio para pago_movil
},
  montoTotalDeudaAnterior: { type: Number }
});

module.exports = mongoose.model('Pago', PagoSchema);