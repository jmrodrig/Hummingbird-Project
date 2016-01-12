# --- !Ups

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `article_description` `article_description` LONGTEXT NULL DEFAULT NULL ;


# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `location_name` `location_name` VARCHAR(555) NULL DEFAULT NULL ;
