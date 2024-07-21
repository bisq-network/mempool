import { Component, OnInit, HostBinding } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.scss']
})
export class DocsComponent implements OnInit {

  activeTab = 0;

  @HostBinding('attr.dir') dir = 'ltr';

  constructor(
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    document.querySelector<HTMLElement>( "html" ).style.scrollBehavior = "smooth";
  }

  ngDoCheck(): void {
    this.activeTab = 1;
  }

  ngOnDestroy(): void {
    document.querySelector<HTMLElement>( "html" ).style.scrollBehavior = "auto";
  }
}
