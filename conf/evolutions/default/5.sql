# --- !Ups

ALTER TABLE `lir_backoffice`.`stories` CHANGE COLUMN `version` `version` TIMESTAMP NOT NULL  ;


  
# --- !Downs

ALTER TABLE `lir_backoffice`.`stories` CHANGE COLUMN `version` `version` BIGINT(20) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  ;
