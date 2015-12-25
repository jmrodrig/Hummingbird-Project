# --- !Ups

ALTER TABLE `lir_backoffice`.`stories` 
ADD CONSTRAINT `location_id`
  FOREIGN KEY (`location_id`)
  REFERENCES `lir_backoffice`.`story_location` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

  
# --- !Downs

ALTER TABLE `lir_backoffice`.`stories` 
DROP FOREIGN KEY `location_id`;
ALTER TABLE `lir_backoffice`.`stories` 
DROP INDEX `locationId_idx` ;
