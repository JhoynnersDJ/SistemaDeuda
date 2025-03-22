const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const cors = require('cors');
const RegistroGastos = require('./Modelo/registroGastos');
const Cliente = require('./Modelo/cliente');
const Deuda = require('./Modelo/deuda');
const Pago = require('./Modelo/pago');

// Conexión a la base de datos Omniservices
const uri = "mongodb+srv://jhoysantaella15:Melon24@cluster0.zrpgq2r.mongodb.net/BeatrizLaQuinta?retryWrites=true&w=majority";
mongoose.connect(uri)
  .then(() => {
    console.log('Conexión exitosa a la base de datos');
  })
  .catch((error) => {
    console.error('Error en la conexión a la base de datos:', error);
  });

// Middleware CORS
app.use(cors());
app.use(express.static('public'));
app.use(express.json());//Agregado para procesar json.
app.use(express.urlencoded({ extended: true })); //Agregado para procesar formularios.

// Ruta para registrar un nuevo cliente
app.post('/clientes', async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).send(cliente);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Ruta para registrar una nueva deuda
app.post('/deudas', async (req, res) => {
  try {
    const { cliente, descripcion, monto } = req.body;

    // Crear la nueva deuda
    const nuevaDeuda = new Deuda({
      cliente: cliente,
      descripcion: descripcion,
      monto: monto,
    });

    // Guardar la nueva deuda
    await nuevaDeuda.save();

    // Actualizar el monto total del cliente
    const clienteActualizado = await Cliente.findByIdAndUpdate(
      cliente,
      { $inc: { montoTotalDeudas: monto } },
      { new: true }
    );

    res.status(201).send({ deuda: nuevaDeuda, cliente: clienteActualizado });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Punto final para obtener las últimas 3 deudas registradas
app.get('/api/ultimas-deudas', async (req, res) => {
  try {
      const deudas = await Deuda.find().sort({ fechaEmision: -1 }).limit(3).populate('cliente');
      res.json(deudas);
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener las últimas deudas' });
  }
});

// Punto final para obtener clientes con sus deudas
app.get('/api/clientes-deudas', async (req, res) => {
  try {
    const clientes = await Cliente.aggregate([
      {
        $lookup: {
          from: 'deudas',
          localField: '_id',
          foreignField: 'cliente',
          as: 'deudas'
        }
      },
      {
        $project: {
          _id: 1,
          nombre: 1,
          apellido: 1,
          deudas: 1,
          montoTotalDeudas: 1
        }
      }
    ]);
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes con deudas:', error);
    res.status(500).json({ mensaje: 'Error al obtener clientes con deudas' });
  }
});
// Punto final para procesar el formulario de gastos
app.post('/api/gastos', async (req, res) => {
  const { tipoGasto, descripcion, MontoDolares } = req.body;

  // Crear una nueva instancia del modelo RegistroGastos
  const nuevoRegistro = new RegistroGastos({
    tipo: tipoGasto,
    descripcion: descripcion,
    MontoDolares: MontoDolares,
  });

  try {
    // Guardar el nuevo registro en la base de datos
    const resultado = await nuevoRegistro.save();
    console.log('Registro guardado:', resultado);
    res.json({ mensaje: 'Datos guardados correctamente' });
  } catch (error) {
    console.error('Error al guardar en la base de datos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Punto final para obtener el total
app.get('/api/ver-total', async (req, res) => {
  try {
    // Realizar la consulta para obtener la suma de los MontoDolares
    const resultado = await RegistroGastos.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$MontoDolares' },
        },
      },
    ]);

    // Devolver el resultado como JSON
    res.json({ total: resultado.length > 0 ? resultado[0].total : 0 });
  } catch (error) {
    console.error('Error al obtener el total:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Página de detalle de gastos
app.get('/detalle-gastos', async (req, res) => {
  try {
    // Obtener todos los registros de gastos
    const gastos = await RegistroGastos.find();

    // Calcular el total de gastos
    const totalGastos = gastos.reduce((total, gasto) => total + gasto.MontoDolares, 0);

    // Renderizar la página de detalle con la lista de gastos y el total
    res.json({
      gastos: gastos.map(gasto => ({
        _id: gasto._id,
        tipo: gasto.tipo,
        descripcion: gasto.descripcion,
        MontoDolares: gasto.MontoDolares.toFixed(2),
        fecha: gasto.createdAt ? gasto.createdAt.toLocaleDateString() : 'Fecha no disponible',
      })),
      totalGastos: totalGastos.toFixed(2),
    });
  } catch (error) {
    console.error('Error al obtener el detalle de gastos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Punto final para obtener un gasto por su ID
app.get('/api/gastos/:id', async (req, res) => {
  const gastoId = req.params.id;

  try {
    // Obtener el gasto por su ID
    const gasto = await RegistroGastos.findById(gastoId);

    if (gasto) {
      res.json({ gasto });
    } else {
      res.status(404).json({ mensaje: 'Gasto no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener el gasto:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Punto final para eliminar un gasto por su ID
app.delete('/api/gastos/:id', async (req, res) => {
  const gastoId = req.params.id;

  try {
    // Eliminar el gasto por su ID
    const resultado = await RegistroGastos.findByIdAndDelete(gastoId);

    if (resultado) {
      res.json({ mensaje: 'Gasto eliminado correctamente' });
    } else {
      res.status(404).json({ mensaje: 'Gasto no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar el gasto:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
      const nombre = req.query.nombre;

      if (nombre) {
          // Filtrar clientes por nombre usando una expresión regular (LIKE %nombre%)
          const clientes = await Cliente.find({
              $or: [
                  { nombre: { $regex: '^' + nombre, $options: 'i' } }, // Buscar nombres que comiencen con "nombre"
                  { apellido: { $regex: '^' + nombre, $options: 'i' } } // Buscar apellidos que comiencen con "nombre"
              ]
          });
          res.json(clientes);
      } else {
          // Obtener todos los clientes si no se proporciona un nombre
          const clientes = await Cliente.find();
          res.json(clientes);
      }
  } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener clientes registrados' });
  }
});

app.get('/api/clientes/:id', async (req, res) => {
  try {
      console.log('Solicitud GET a /api/clientes/:id recibida:', req.params.id);
      const cliente = await Cliente.findById(req.params.id);
      if (!cliente) {
          console.log('Cliente no encontrado');
          return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      console.log('Cliente encontrado:', cliente);
      res.json(cliente);
  } catch (error) {
      console.error('Error al obtener el cliente:', error);
      res.status(500).json({ message: error.message });
  }
});


app.put('/api/clientes/:id', async (req, res) => {
  try {
      console.log('Solicitud PUT a /api/clientes/:id recibida:', req.params.id);
      console.log('Cuerpo de la solicitud:', req.body); // Agregar console.log
      const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!cliente) {
          console.log('Cliente no encontrado');
          return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      console.log('Cliente actualizado:', cliente);
      res.json(cliente);
  } catch (error) {
      console.error('Error al actualizar el cliente:', error);
      res.status(500).json({ message: error.message });
  }
});

app.get('/api/clientes-deudas', async (req, res) => {
  try {
      const clientes = await Cliente.aggregate([
          {
              $lookup: {
                  from: 'deudas',
                  localField: '_id',
                  foreignField: 'cliente',
                  as: 'deudas'
              }
          },
          {
              $project: {
                  _id: 1,
                  nombre: 1,
                  apellido: 1,
                  deudas: 1,
                  montoTotalDeudas: 1 // Asegúrate de que este campo esté presente
              }
          }
      ]);

      // Calcular el total de todas las deudas
      const totalDeudas = clientes.reduce((total, cliente) => total + cliente.montoTotalDeudas, 0);

      res.json({ clientes, totalDeudas });
  } catch (error) {
      console.error('Error al obtener clientes con deudas:', error);
      res.status(500).json({ mensaje: 'Error al obtener clientes con deudas' });
  }
});

// Punto final para obtener el historial de un cliente
app.get('/api/cliente-historial/:id', async (req, res) => {
  const clienteId = req.params.id;

  try {
      const cliente = await Cliente.findById(clienteId);
      const deudas = await Deuda.find({ cliente: clienteId });
      const pagos = await Pago.find({ cliente: clienteId }); // Obtener los pagos del cliente

      res.json({ cliente, deudas, pagos }); // Incluir los pagos en la respuesta
  } catch (error) {
      console.error('Error al obtener el historial del cliente:', error);
      res.status(500).json({ mensaje: 'Error al obtener el historial del cliente' });
  }
});


// Ruta para registrar un nuevo pago
app.post('/pagos', async (req, res) => {
  try {
      const { cliente, montoPagado, metodoPago, banco, referencia } = req.body;

      // Obtener el monto total de deuda del cliente antes del pago
      const clienteAnterior = await Cliente.findById(cliente);
      const montoTotalDeudaAnterior = clienteAnterior.montoTotalDeudas;

      // Crear el nuevo pago
      const pago = new Pago({
          cliente: cliente,
          montoPagado: montoPagado,
          metodoPago: metodoPago,
          montoTotalDeudaAnterior: montoTotalDeudaAnterior, // Almacenar el monto anterior
          banco:banco,
          referencia:referencia
      });

      // Guardar el pago
      await pago.save();

      // Actualizar el monto total de deudas del cliente
      const clienteActualizado = await Cliente.findByIdAndUpdate(
          cliente,
          { $inc: { montoTotalDeudas: -montoPagado } },
          { new: true }
      );

      res.status(201).send({ pago, cliente: clienteActualizado });
  } catch (error) {
      res.status(400).send(error);
  }
});

// Punto final para editar un gasto por su ID
app.put('/api/gastos/:id', async (req, res) => {
  const gastoId = req.params.id;
  const { tipo, descripcion, MontoDolares } = req.body;

  try {
    // Actualizar el gasto por su ID
    const resultado = await RegistroGastos.findByIdAndUpdate(
      gastoId,
      {
        tipo,
        descripcion,
        MontoDolares,
      },
      { new: true }
    );

    if (resultado) {
      res.json({ mensaje: 'Gasto actualizado correctamente', gasto: resultado });
    } else {
      res.status(404).json({ mensaje: 'Gasto no encontrado' });
    }
  } catch (error) {
    console.error('Error al editar el gasto:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Servir la página de registro de clientes
app.get('/registro-clientes', (req, res) => {
  res.sendFile(__dirname + '/public/registro-clientes.html');
});

// Servir la página de registro de deudas
app.get('/registro-deudas', (req, res) => {
  res.sendFile(__dirname + '/public/registro-deudas.html');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});