# --- !Ups

CREATE TABLE `lir_backoffice`.`story_location` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `latitude` DOUBLE NOT NULL,
  `longitude` DOUBLE NOT NULL,
  `radius` DOUBLE NULL DEFAULT 5,
  PRIMARY KEY (`id`));
 
 
ALTER TABLE `lir_backoffice`.`stories` 
ADD COLUMN `location_id` BIGINT NULL AFTER `published`;
 
  
# --- !Downs

ALTER TABLE `lir_backoffice`.`stories` 
DROP COLUMN `location_id`;

DROP TABLE `lir_backoffice`.`story_location`;


