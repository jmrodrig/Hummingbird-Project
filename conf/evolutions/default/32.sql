# --- !Ups

ALTER TABLE `lir_backoffice`.`locations`
  ADD COLUMN `ismain` TINYINT(1) NULL DEFAULT '0' AFTER `model_version`;

# --- !Downs

ALTER TABLE `lir_backoffice`.`locations`
  DROP COLUMN `ismain` ;
