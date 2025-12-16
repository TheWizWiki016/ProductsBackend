export const validateSchema = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body); // valida contra el esquema recibido
    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: error.errors?.map((err) => err.message) || ["Error de validación"]
    });
  }
};
