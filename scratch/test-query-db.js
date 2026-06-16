const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const args = {
    model: 'client',
    operation: 'findMany',
    queryString: '{"take": 5}'
  };

  const { model, operation, queryString } = args;
  try {
    const prismaModel = model.charAt(0).toLowerCase() + model.slice(1);
    
    if (!['findMany', 'findFirst', 'count'].includes(operation)) {
      console.log({ error: 'Operación no permitida.' });
      return;
    }

    if (!prisma[prismaModel]) {
       console.log({ error: `El modelo ${model} no existe en la base de datos.` });
       return;
    }

    let queryArgs = {};
    try {
      queryArgs = typeof queryString === 'string' ? JSON.parse(queryString) : queryString;
    } catch (e) {
      console.log({ error: 'El queryString no es un JSON válido.' });
      return;
    }

    if (operation === 'findMany') {
      queryArgs.take = queryArgs.take ? Math.min(queryArgs.take, 50) : 20;
    }

    const dbResult = await prisma[prismaModel][operation](queryArgs);
    console.log({ model: prismaModel, operation, result: dbResult.length });
  } catch (error) {
    console.log(`Error in query_database: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
