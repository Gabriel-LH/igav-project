ALTER TABLE "user"
ADD COLUMN "dni" TEXT;

CREATE UNIQUE INDEX "user_dni_key" ON "user"("dni");
