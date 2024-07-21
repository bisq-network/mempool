import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-bisq-master-page',
  templateUrl: './bisq-master-page.component.html',
  styleUrls: ['./bisq-master-page.component.scss'],
})
export class BisqMasterPageComponent implements OnInit {
  navCollapsed = false;
  isMobile = window.innerWidth <= 767.98;
  urlLanguage: string;
  footerVisible = false;

  constructor(
    private languageService: LanguageService,
  ) { }

  ngOnInit() {
    this.urlLanguage = this.languageService.getLanguageForUrl();
  }

  collapse(): void {
    this.navCollapsed = !this.navCollapsed;
  }

  onResize(event: any) {
    this.isMobile = window.innerWidth <= 767.98;
  }
}
