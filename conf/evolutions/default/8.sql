# --- !Ups

ALTER TABLE `lir_backoffice`.`stories` 
ADD COLUMN `location_name` LONGTEXT NULL DEFAULT NULL AFTER `thumbnail`;



  
# --- !Downs

ALTER TABLE `lir_backoffice`.`stories` 
DROP COLUMN `location_name`;