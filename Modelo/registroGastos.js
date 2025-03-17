const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const registroGastosSchema = new Schema({
  tipo: String,
  descripcion: String,
  MontoDolares: Number,
  createdAt: { type: Date, default: Date.now },
});

const RegistroGastos = mongoose.model('RegistroGastos', registroGastosSchema);

module.exports = RegistroGastos;