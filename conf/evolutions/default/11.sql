# --- !Ups

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `location_name` `location_name` VARCHAR(255) NULL DEFAULT NULL ,
ADD COLUMN `article_date` VARCHAR(45) NULL DEFAULT NULL AFTER `article_link`,
ADD COLUMN `article_author` VARCHAR(45) NULL DEFAULT NULL AFTER `article_date`,
ADD COLUMN `article_source` VARCHAR(45) NULL DEFAULT NULL AFTER `article_author`;

# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
DROP COLUMN `article_date`,
DROP COLUMN `article_author`,
DROP COLUMN `article_source`,
CHANGE COLUMN `location_name` `location_name` LONGTEXT NULL DEFAULT NULL ;
