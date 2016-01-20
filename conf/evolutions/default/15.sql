# --- !Ups

ALTER TABLE `lir_backoffice`.`story_location`
RENAME TO  `lir_backoffice`.`locations` ;


# --- !Downs

ALTER TABLE `lir_backoffice`.`locations` 
RENAME TO  `lir_backoffice`.`story_location` ;
