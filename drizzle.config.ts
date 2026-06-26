import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: 'mysql://root:Kisan@2024@localhost:3306/kisanvision',
  },
})
