# --- !Ups

ALTER TABLE `lir_backoffice`.`stories` 
ADD COLUMN `published` TINYINT(1) NULL DEFAULT 0 AFTER `version`;

# --- !Downs

ALTER TABLE `lir_backoffice`.`stories` 
DROP COLUMN `published`;


