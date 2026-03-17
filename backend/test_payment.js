const { Payment, Assessment, Entity, User } = require('./models');

async function test() {
  try {
    console.log('Fetching Payments with includes...');
    const payments = await Payment.findAll({
      include: [
        {
          model: Assessment,
          as: "assessment",
          include: [
            { model: Entity, as: "entity" },
          ],
        },
        { model: User, as: "recorder" },
      ],
      order: [["paymentDate", "DESC"]],
    });
    console.log('Success! Found', payments.length, 'Payments');
    process.exit(0);
  } catch (err) {
    console.error('Error fetching Payments:');
    console.error(err);
    process.exit(1);
  }
}

test();
