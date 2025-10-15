-- AlterTable
ALTER TABLE "hanja_dict" ADD COLUMN     "is_good_for_naming" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "hanja_dict_element_is_good_for_naming_idx" ON "hanja_dict"("element", "is_good_for_naming");

-- CreateIndex
CREATE INDEX "hanja_dict_gender_idx" ON "hanja_dict"("gender");

-- CreateIndex
CREATE INDEX "hanja_dict_name_frequency_idx" ON "hanja_dict"("name_frequency");
