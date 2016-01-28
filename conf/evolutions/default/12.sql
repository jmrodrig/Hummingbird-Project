# --- !Ups

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `article_description` `article_description` LONGTEXT NULL DEFAULT NULL ;


# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
CHANGE COLUMN `article_description` `article_description` VARCHAR(555) NULL DEFAULT NULL ;
