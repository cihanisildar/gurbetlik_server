import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// Utility to generate a slug from city name, country, and id
function slugify(name: string, country: string, id: string): string {
  return (
    name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') +
    '-' +
    country.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') +
    '-' +
    id
  );
}

async function main() {
  const csvPath = path.join(__dirname, '../src/utils/world-cities.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  let imported = 0;
  let skipped = 0;

  for (const record of records) {
    const id = record.geonameid;
    const name = record.name;
    const country = record.country;
    if (!id || !name || !country) {
      skipped++;
      continue;
    }
    const slug = slugify(name, country, id);
    try {
      // Upsert to avoid duplicates
      await prisma.city.upsert({
        where: { id },
        update: { name, country, slug },
        create: { id, name, country, slug },
      });
      imported++;
    } catch (err) {
      console.error(`Failed to import city: ${name}, ${country} (${id})`, err);
      skipped++;
    }
  }

  console.log(`Imported ${imported} cities. Skipped ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 