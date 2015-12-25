# --- !Ups

ALTER TABLE `lir_backoffice`.`stories` 
CHANGE COLUMN `summary` `summary` LONGTEXT NULL DEFAULT NULL ,
ADD COLUMN `article_title` VARCHAR(255) NULL DEFAULT NULL AFTER `location_name`,
ADD COLUMN `article_description` VARCHAR(555) NULL DEFAULT NULL AFTER `article_title`,
ADD COLUMN `article_image` VARCHAR(255) NULL DEFAULT NULL AFTER `article_description`,
ADD COLUMN `article_link` VARCHAR(255) NULL DEFAULT NULL AFTER `article_image`;




  
# --- !Downs

ALTER TABLE `lir_backoffice`.`stories` 
CHANGE COLUMN `summary` `summary` VARCHAR(255) NULL DEFAULT NULL ,
DROP COLUMN `article_title`;
DROP COLUMN `article_description`;
DROP COLUMN `article_image`;
DROP COLUMN `article_link`;