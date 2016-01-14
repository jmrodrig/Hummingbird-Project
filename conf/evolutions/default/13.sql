# --- !Ups

ALTER TABLE `lir_backoffice`.`stories`
ADD COLUMN `article_language` VARCHAR(45) NULL DEFAULT NULL AFTER `article_source`;


# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
DROP COLUMN `article_language`;
