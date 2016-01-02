# --- !Ups

ALTER TABLE `lir_backoffice`.`stories`
ADD COLUMN `content` LONGTEXT NULL DEFAULT NULL AFTER `summary`;






# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
DROP COLUMN `content`;
