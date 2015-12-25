# --- !Ups

ALTER TABLE `lir_backoffice`.`stories` 
ADD COLUMN `thumbnail` LONGTEXT NULL DEFAULT NULL AFTER `location_id`;



  
# --- !Downs

ALTER TABLE `lir_backoffice`.`stories` 
DROP COLUMN `thumbnail`;


