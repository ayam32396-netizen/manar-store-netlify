require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database/db');

async function seed() {
  await db.init();
  console.log('Seeding database for Manar Elhady Store...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@manar-store.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@Manar2024';
  
  const adminExists = db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail);
  if (!adminExists) {
    const hash = await bcrypt.hash(adminPassword, 12);
    db.prepare('INSERT INTO admins (email, password_hash) VALUES (?, ?)').run(adminEmail, hash);
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log('Admin user already exists. Skipping admin creation.');
  }

  const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productsCount === 0) {
    const products = [
      // 💆 HAIR
      { name: 'زيت بنت المغرب', description: 'يعمل على كثافة الشعر', price: 250, discount: null, category: 'hair', image: 'zit_bint_almaghrib.jpg', stock: 20 },
      { name: 'زيت بنت مطيل', description: 'يعمل على إطالة الشعر', price: 300, discount: null, category: 'hair', image: 'zit_bint_mutil.jpg', stock: 20 },
      { name: 'زيت الحشيش', description: 'يعمل على إطالة الشعر', price: 250, discount: null, category: 'hair', image: 'zit_alhashish.jpg', stock: 20 },
      
      // 🌿 SKIN
      { name: 'صابونة النيلة الزرقاء', description: 'لتفتيح البشرة، مناسبة لجميع أنواع البشرة', price: 125, discount: null, category: 'skin', image: 'sabonet_alnila.jpg', stock: 20 },
      { name: 'مجموعة لبان الذكر', description: 'للبشرة الدهنية', price: 440, discount: null, category: 'skin', image: 'majmouat_loban.jpg', stock: 15 },
      { name: 'صابونة الشاي الأخضر', description: null, price: 100, discount: null, category: 'skin', image: 'sabonet_shay.jpg', stock: 25 },
      { name: 'غسول العكر الفاسي', description: 'غني عن التعريف', price: 150, discount: null, category: 'skin', image: 'ghassoul_oker.jpg', stock: 20 },
      
      // 🛁 BODY
      { name: 'ليفة مغربية', description: 'ليفة كسال الخلود درجة أولى لإزالة الجلد الميت', price: 110, discount: null, category: 'body', image: 'leefa_maghribiya.jpg', stock: 30 },
      { name: 'صابون مغربي', description: 'بزيت الزيتون درجة أولى', price: 100, discount: null, category: 'body', image: 'saboon_maghribi.jpg', stock: 25 },
      { name: 'الدلكة السودانية', description: null, price: 150, discount: null, category: 'body', image: 'dilka_sudaniya.jpg', stock: 20 },
      { name: 'طمي الشرفاء الأصيل', description: null, price: 125, discount: null, category: 'body', image: 'tami_ashrafa.jpg', stock: 20 },
      { name: 'التبريمة المغربية', description: '21 عشبة طبيعية', price: 125, discount: null, category: 'body', image: 'tabriima_maghribiya.jpg', stock: 20 },
      { name: 'النيلة الزرقاء', description: null, price: 150, discount: null, category: 'body', image: 'nila_zarqa.jpg', stock: 25 },
    ];
    
    const insert = db.prepare('INSERT INTO products (name, description, price, discount, category, image, stock) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const insertTx = db.transaction((prods) => {
      for (const p of prods) {
        insert.run(p.name, p.description, p.price, p.discount, p.category, p.image, p.stock);
      }
    });
    insertTx(products);
    console.log(`Seeded ${products.length} products successfully.`);
  } else {
    console.log('Products already seeded. Skipping products creation.');
  }
  
  console.log('Seeding complete!');
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
