# --- !Ups

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `story_language` `language` VARCHAR(45) NULL DEFAULT NULL ,
ADD COLUMN `format` TINYINT(1) NULL DEFAULT NULL AFTER `date_created`,
ADD COLUMN `premium` TINYINT(1) NULL DEFAULT NULL AFTER `format`;
ADD COLUMN `date_modified` DATETIME NULL DEFAULT NULL AFTER `premium`;


# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `language` `story_language` VARCHAR(45) NULL DEFAULT NULL ,
DROP COLUMN `format`,
DROP COLUMN `premium`
DROP COLUMN `date_modified`;
